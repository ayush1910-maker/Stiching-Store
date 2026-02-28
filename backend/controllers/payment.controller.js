import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Payment } from "../models/payment.model.js";
import { Payout } from "../models/payout.model.js";
import { DeliveryPartner } from "../models/deliveryPartner.model.js";
import { TailorDetail } from "../models/tailorDetail.model.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import razorpay, {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from "../utils/razorpay.js";
import {
  resolveOrderById,
  updateOrderByModel
} from "../models/order.model.js";

const paidStatuses = ["paid", "SUCCESS", "PAID", "refunded", "REFUNDED"];

const isPaidOrder = (order) => {
  const paymentStatus = String(order?.paymentStatus || "").toUpperCase();
  return paymentStatus === "PAID";
};

const getPaymentType = (orderModel) =>
  orderModel === "EcommerceOrder" ? "ecommerce" : "stitching";

const markOrderAsPaymentPending = async ({ orderModel, orderId, session = null }) => {
  const update = {
    $set: {
      paymentStatus: "PENDING"
    }
  };

  if (orderModel === "StitchingOrder") {
    update.$set.orderStatus = "PAYMENT_PENDING";
  }

  return updateOrderByModel({ orderModel, orderId, update, session });
};

const markOrderAsPaid = async ({ orderModel, orderId, paymentId, session = null }) => {
  const update = {
    $set: {
      paymentStatus: "PAID"
    }
  };

  if (orderModel === "StitchingOrder") {
    update.$set.orderStatus = "PAYMENT_COMPLETED";
    update.$set.status = "PAYMENT_COMPLETED";
    update.$set.paymentId = paymentId;
  } else if (orderModel === "EcommerceOrder") {
    update.$set.orderStatus = "CONFIRMED";
    update.$set.status = "CONFIRMED";
  }

  return updateOrderByModel({ orderModel, orderId, update, session });
};

const markOrderAsFailed = async ({ orderModel, orderId, session = null }) => {
  const update = {
    $set: {
      paymentStatus: "FAILED"
    }
  };

  if (orderModel === "StitchingOrder") {
    update.$set.orderStatus = "PAYMENT_PENDING";
  }

  return updateOrderByModel({ orderModel, orderId, update, session });
};

const markOrderAsRefunded = async ({ orderModel, orderId, session = null }) => {
  const update = {
    $set: {
      paymentStatus: "REFUNDED"
    }
  };

  if (orderModel === "StitchingOrder") {
    update.$set.orderStatus = "REFUNDED";
    update.$set.status = "REFUNDED";
  }

  return updateOrderByModel({ orderModel, orderId, update, session });
};

const createOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const { order, orderModel } = await resolveOrderById(orderId, req.user._id);

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    if (isPaidOrder(order)) {
      return sendError(res, "Order is already paid", 409);
    }

    const amount = Number(order.totalAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return sendError(res, "Invalid order amount", 400);
    }

    const existingPaidPayment = await Payment.findOne({
      order: order._id,
      user: req.user._id,
      status: { $in: paidStatuses }
    });

    if (existingPaidPayment) {
      return sendError(res, "Payment already completed for this order", 409);
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rcpt_${String(order._id)}`,
      notes: {
        orderId: String(order._id),
        orderModel,
        userId: String(req.user._id)
      }
    });

    let payment = await Payment.findOne({
      order: order._id,
      user: req.user._id,
      status: { $in: ["created", "failed", "CREATED", "FAILED", "PENDING"] }
    }).sort({ createdAt: -1 });

    if (payment) {
      payment.razorpayOrderId = razorpayOrder.id;
      payment.amount = amount;
      payment.currency = razorpayOrder.currency || "INR";
      payment.status = "created";
      payment.paymentType = getPaymentType(orderModel);
      payment.orderModel = orderModel;
      payment.transactionDate = new Date();
      await payment.save();
    } else {
      payment = await Payment.create({
        user: req.user._id,
        userId: req.user._id,
        order: order._id,
        orderId: order._id,
        orderModel,
        razorpayOrderId: razorpayOrder.id,
        amount,
        currency: razorpayOrder.currency || "INR",
        paymentType: getPaymentType(orderModel),
        status: "created",
        transactionDate: new Date()
      });
    }

    await markOrderAsPaymentPending({
      orderModel,
      orderId: order._id
    });

    return sendSuccess(
      res,
      "Razorpay order created successfully",
      {
        paymentId: payment._id,
        razorpayOrder
      },
      201
    );
  } catch (error) {
    return sendError(res, error.message || "Failed to create payment order");
  }
};

const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    } = req.body;

    const payment = await Payment.findOne({
      razorpayOrderId,
      user: req.user._id
    }).session(session);

    if (!payment) {
      await session.abortTransaction();
      return sendError(res, "Payment record not found", 404);
    }

    if (payment.status === "paid" && payment.razorpayPaymentId === razorpayPaymentId) {
      await session.commitTransaction();
      return sendSuccess(res, "Payment already verified", payment);
    }

    if (payment.status === "paid" && payment.razorpayPaymentId && payment.razorpayPaymentId !== razorpayPaymentId) {
      await session.abortTransaction();
      return sendError(res, "Payment already verified with another transaction", 409);
    }

    const isSignatureValid = verifyRazorpayPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!isSignatureValid) {
      payment.status = "failed";
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.transactionDate = new Date();
      await payment.save({ session });

      await markOrderAsFailed({
        orderModel: payment.orderModel,
        orderId: payment.order,
        session
      });

      await session.commitTransaction();
      return sendError(res, "Invalid payment signature", 400);
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.transactionDate = new Date();
    await payment.save({ session });

    await markOrderAsPaid({
      orderModel: payment.orderModel,
      orderId: payment.order,
      paymentId: payment._id,
      session
    });

    await session.commitTransaction();

    return sendSuccess(res, "Payment verified successfully", payment);
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to verify payment");
  } finally {
    session.endSession();
  }
};

const refundPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId, amount } = req.body;
    const refundAmount = Number(amount);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      await session.abortTransaction();
      return sendError(res, "Invalid refund amount", 400);
    }

    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      return sendError(res, "Payment not found", 404);
    }

    if (payment.status !== "paid" && payment.status !== "SUCCESS") {
      await session.abortTransaction();
      return sendError(res, "Only paid transactions can be refunded", 400);
    }

    if (!payment.razorpayPaymentId) {
      await session.abortTransaction();
      return sendError(res, "Razorpay payment id missing", 400);
    }

    if (payment.refundAmount > 0 || payment.status === "refunded" || payment.status === "REFUNDED") {
      await session.abortTransaction();
      return sendError(res, "Refund already processed for this payment", 409);
    }

    if (refundAmount > payment.amount) {
      await session.abortTransaction();
      return sendError(res, "Refund amount exceeds payment amount", 400);
    }

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(refundAmount * 100)
    });

    payment.status = "refunded";
    payment.refundStatus = "processed";
    payment.refundAmount = Number((refund.amount / 100).toFixed(2));
    payment.razorpayRefundId = refund.id;
    payment.transactionDate = new Date();
    await payment.save({ session });

    await markOrderAsRefunded({
      orderModel: payment.orderModel,
      orderId: payment.order,
      session
    });

    await session.commitTransaction();

    return sendSuccess(res, "Refund processed successfully", {
      payment,
      refund
    });
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to process refund");
  } finally {
    session.endSession();
  }
};

const payout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      recipientId,
      recipientType,
      amount,
      mode,
      narration,
      purpose,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId
    } = req.body;

    const payoutAmount = Number(amount);
    if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
      await session.abortTransaction();
      return sendError(res, "Invalid payout amount", 400);
    }

    if (!process.env.RAZORPAY_X_ACCOUNT_NUMBER) {
      await session.abortTransaction();
      return sendError(res, "Missing Razorpay source account configuration", 500);
    }

    const recipient = await User.findById(recipientId).session(session);
    if (!recipient) {
      await session.abortTransaction();
      return sendError(res, "Recipient not found", 404);
    }

    if (recipientType === "tailor" && recipient.role !== "tailor") {
      await session.abortTransaction();
      return sendError(res, "Recipient type and user role mismatch", 400);
    }

    if (recipientType === "delivery" && recipient.role !== "delivery") {
      await session.abortTransaction();
      return sendError(res, "Recipient type and user role mismatch", 400);
    }

    const recipientDetail =
      recipientType === "tailor"
        ? await TailorDetail.findOne({ userId: recipient._id }).session(session)
        : await DeliveryPartner.findOne({ userId: recipient._id }).session(session);

    const bank = recipientDetail?.bankDetails || {};

    const resolvedAccountHolder = accountHolderName || bank.accountHolderName || recipient.name;
    const resolvedAccountNumber = accountNumber || bank.accountNumber;
    const resolvedIfscCode = ifscCode || bank.ifscCode;
    const resolvedUpiId = upiId || bank.upiId;

    const fundAccount = resolvedUpiId
      ? {
          account_type: "vpa",
          vpa: {
            address: resolvedUpiId
          },
          contact: {
            name: recipient.name,
            email: recipient.email,
            contact: recipient.phone || "9999999999",
            type: "employee",
            reference_id: `user_${recipient._id}`
          }
        }
      : {
          account_type: "bank_account",
          bank_account: {
            name: resolvedAccountHolder,
            ifsc: resolvedIfscCode,
            account_number: resolvedAccountNumber
          },
          contact: {
            name: recipient.name,
            email: recipient.email,
            contact: recipient.phone || "9999999999",
            type: "employee",
            reference_id: `user_${recipient._id}`
          }
        };

    if (!resolvedUpiId && (!resolvedAccountNumber || !resolvedIfscCode || !resolvedAccountHolder)) {
      await session.abortTransaction();
      return sendError(res, "Recipient bank details are incomplete", 400);
    }

    const payoutResponse = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
      fund_account: fundAccount,
      amount: Math.round(payoutAmount * 100),
      currency: "INR",
      mode,
      purpose,
      queue_if_low_balance: true,
      narration: narration || `Payout to ${recipient.name}`,
      reference_id: `payout_${recipient._id}_${Date.now()}`
    });

    const payoutRecord = await Payout.create(
      [
        {
          userId: recipient._id,
          amount: payoutAmount,
          type: recipientType.toUpperCase(),
          status: payoutResponse.status === "processed" ? "PROCESSED" : "PROCESSING",
          processedDate: payoutResponse.status === "processed" ? new Date() : null,
          payoutId: payoutResponse.id,
          currency: payoutResponse.currency || "INR",
          razorpayStatus: payoutResponse.status,
          recipientType,
          referenceId: payoutResponse.reference_id,
          earningsStatus: payoutResponse.status === "processed" ? "SETTLED" : "PENDING"
        }
      ],
      { session }
    );

    if (recipientType === "tailor") {
      await TailorDetail.findOneAndUpdate(
        { userId: recipient._id },
        {
          $set: {
            "earnings.status": payoutResponse.status === "processed" ? "PAID" : "PENDING",
            "earnings.lastPayoutAt": new Date()
          },
          $inc: {
            "earnings.paid": payoutAmount
          }
        },
        { session }
      );
    } else {
      await DeliveryPartner.findOneAndUpdate(
        { userId: recipient._id },
        {
          $set: {
            "earnings.status": payoutResponse.status === "processed" ? "PAID" : "PENDING",
            "earnings.lastPayoutAt": new Date()
          },
          $inc: {
            "earnings.paid": payoutAmount
          }
        },
        { session }
      );
    }

    await session.commitTransaction();

    return sendSuccess(
      res,
      "Payout processed successfully",
      {
        payout: payoutRecord[0],
        razorpayPayout: payoutResponse
      },
      201
    );
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to process payout");
  } finally {
    session.endSession();
  }
};

const webhook = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];
    const rawBody = req.rawBody || JSON.stringify(req.body || {});

    if (!webhookSignature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      await session.abortTransaction();
      return sendError(res, "Missing webhook signature", 400);
    }

    const isValid = verifyRazorpayWebhookSignature({
      body: rawBody,
      signature: webhookSignature
    });

    if (!isValid) {
      await session.abortTransaction();
      return sendError(res, "Invalid webhook signature", 400);
    }

    const event = req.body?.event;
    const entity = req.body?.payload?.payment?.entity || req.body?.payload?.refund?.entity;

    if (!event || !entity) {
      await session.abortTransaction();
      return sendSuccess(res, "Webhook received");
    }

    let payment = null;

    if (event === "payment.captured" || event === "payment.failed") {
      payment = await Payment.findOne({
        razorpayOrderId: entity.order_id
      }).session(session);
    } else if (event === "refund.processed") {
      payment = await Payment.findOne({
        razorpayPaymentId: entity.payment_id
      }).session(session);
    }

    if (!payment) {
      await session.commitTransaction();
      return sendSuccess(res, "Webhook processed");
    }

    if (eventId && payment.processedWebhookEvents.includes(eventId)) {
      await session.commitTransaction();
      return sendSuccess(res, "Webhook already processed");
    }

    if (event === "payment.captured") {
      if (payment.status !== "paid" && payment.status !== "SUCCESS") {
        payment.status = "paid";
        payment.razorpayPaymentId = entity.id;
        payment.amount = Number((entity.amount || 0) / 100);
        payment.currency = entity.currency || "INR";
        payment.transactionDate = new Date();

        await markOrderAsPaid({
          orderModel: payment.orderModel,
          orderId: payment.order,
          paymentId: payment._id,
          session
        });
      }
    }

    if (event === "payment.failed") {
      if (payment.status !== "paid" && payment.status !== "SUCCESS") {
        payment.status = "failed";
        payment.razorpayPaymentId = entity.id || payment.razorpayPaymentId;
        payment.transactionDate = new Date();

        await markOrderAsFailed({
          orderModel: payment.orderModel,
          orderId: payment.order,
          session
        });
      }
    }

    if (event === "refund.processed") {
      const processedRefundAmount = Number((entity.amount || 0) / 100);
      payment.refundAmount = processedRefundAmount;
      payment.status = "refunded";
      payment.refundStatus = "processed";
      payment.razorpayRefundId = entity.id || payment.razorpayRefundId;
      payment.transactionDate = new Date();

      await markOrderAsRefunded({
        orderModel: payment.orderModel,
        orderId: payment.order,
        session
      });
    }

    if (eventId) {
      payment.processedWebhookEvents = [...new Set([...payment.processedWebhookEvents, eventId])];
    }

    await payment.save({ session });
    await session.commitTransaction();

    return sendSuccess(res, "Webhook processed");
  } catch (error) {
    await session.abortTransaction();
    return sendError(res, error.message || "Failed to process webhook");
  } finally {
    session.endSession();
  }
};

export {
  createOrder,
  verifyPayment,
  refundPayment,
  payout,
  webhook
};
