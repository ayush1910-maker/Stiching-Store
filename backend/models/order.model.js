import { StitchingOrder } from "./stitchingOrder.model.js";
import { EcommerceOrder } from "./ecommerceOrder.model.js";

const ORDER_MODEL_MAP = {
  StitchingOrder,
  EcommerceOrder
};

export const resolveOrderById = async (orderId, userId = null, session = null) => {
  const stitchingQuery = { _id: orderId };
  const ecommerceQuery = { _id: orderId };

  if (userId) {
    stitchingQuery.customerId = userId;
    ecommerceQuery.customerId = userId;
  }

  let stitching = StitchingOrder.findOne(stitchingQuery);
  let ecommerce = EcommerceOrder.findOne(ecommerceQuery);

  if (session) {
    stitching = stitching.session(session);
    ecommerce = ecommerce.session(session);
  }

  const [stitchingOrder, ecommerceOrder] = await Promise.all([stitching, ecommerce]);

  if (stitchingOrder) return { order: stitchingOrder, orderModel: "StitchingOrder" };
  if (ecommerceOrder) return { order: ecommerceOrder, orderModel: "EcommerceOrder" };
  return { order: null, orderModel: null };
};

export const updateOrderByModel = async ({ orderModel, orderId, update, session = null }) => {
  const Model = ORDER_MODEL_MAP[orderModel];
  if (!Model) return null;

  let query = Model.findByIdAndUpdate(orderId, update, { new: true });
  if (session) query = query.session(session);

  return query;
};

export { StitchingOrder as Order, StitchingOrder, EcommerceOrder };
