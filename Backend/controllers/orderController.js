const Order = require('../models/Order');
const Product = require('../models/Product');
const { pushNotification } = require('./notificationController');

function genTracking() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'KR-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const LOG_POOLS = {
  verify: [
    'Order received and being verified.',
    'Payment successfully confirmed.',
    'Order has been received and is being reviewed by our team.',
    'Order notification received by the seller.',
  ],
  packing: [
    'Seller is preparing your order.',
    'Items are being carefully packed.',
    'Packing started — products are being secured.',
    'Order is being packed with protective bubble wrap.',
    'Seller has started processing and packing your items.',
  ],
  packed_done: [
    'Packing complete, awaiting courier pickup.',
    'Package is ready for courier pickup.',
    'Shipping label has been printed and attached.',
    'Package is neatly wrapped and waiting to be picked up.',
  ],
  pickup: [
    'Package picked up by {courier}.',
    '{courier} has collected the package from the seller.',
    '{courier} is officially carrying your package.',
    '{courier} driver successfully picked up the package.',
  ],
  transit: [
    'Package is on its way to the destination city.',
    'Package is being sorted at the transit warehouse.',
    'Package arrived at the regional sorting facility.',
    'Package is in transit between cities via express route.',
    'Package has left the origin shipping warehouse.',
    'Package passing through the main logistics hub.',
    'Package is in long-distance delivery.',
  ],
  out_for_delivery: [
    'Courier is heading to your delivery location.',
    'Package is in the final delivery process.',
    'Package left the branch office and is heading to your address.',
    'Delivery rider is on the way — please be ready to receive.',
    'Package is now in the hands of the local delivery driver.',
  ],
  delivered: [
    'Package has been successfully delivered. Thank you for shopping at Kuroyu!',
    'Delivery complete — order arrived at the destination safely.',
    'Package received at the destination address. Enjoy your product!',
    'Order successfully delivered and received. See you again!',
  ],
};

function buildLogs(courierLabel, now, shippedAt, deliveredAt) {
  const logs = [];
  const add = (offset, pool) => logs.push({ time: new Date(now.getTime() + offset), text: pick(pool).replace(/{courier}/g, courierLabel) });

  add(0,                              LOG_POOLS.verify);
  add(rand(10, 30) * 60000,           LOG_POOLS.packing);
  add(rand(60, 180) * 60000,          LOG_POOLS.packed_done);

  const s = shippedAt.getTime() - now.getTime();
  logs.push({ time: shippedAt, text: pick(LOG_POOLS.pickup).replace(/{courier}/g, courierLabel) });
  logs.push({ time: new Date(shippedAt.getTime() + rand(1, 4) * 3600000), text: pick(LOG_POOLS.transit) });
  if (deliveredAt - shippedAt > 8 * 3600000) {
    logs.push({ time: new Date(shippedAt.getTime() + rand(6, 14) * 3600000), text: pick(LOG_POOLS.transit) });
  }

  const outOffset = rand(2, 6) * 3600000;
  logs.push({ time: new Date(deliveredAt.getTime() - outOffset), text: pick(LOG_POOLS.out_for_delivery) });

  logs.push({ time: deliveredAt, text: pick(LOG_POOLS.delivered) });

  return logs.sort((a, b) => a.time - b.time);
}

const createOrder = async (req, res) => {
  try {
    const { items, total, subtotal, shippingCost, addons, courier, shippingAddress, note, paymentMethod } = req.body;
    const trackingNumber = genTracking();

    const order = await Order.create({
      user: req.user.id,
      items, total, subtotal, shippingCost, addons, courier, shippingAddress, trackingNumber, note, paymentMethod,
      status: 'packed',
      logs: [{ time: new Date(), text: 'Order received and being verified.' }],
    });
    pushNotification(req.user.id, {
      icon: 'package',
      title: 'Order Placed!',
      body: `Your order ${trackingNumber} is being processed.`,
    }).catch(() => {});

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    const now = Date.now();
    const toMark = orders.filter(o =>
      !o.cancelled &&
      !o.soldCounted &&
      o.status === 'shipped' &&
      o.deliveredAt &&
      now >= new Date(o.deliveredAt).getTime()
    );
    if (toMark.length > 0) {
      await Promise.all(toMark.map(async o => {
        o.soldCounted = true;
        await o.save();
        await Promise.all(o.items.map(item =>
          Product.findByIdAndUpdate(item.product || item.productId, { $inc: { soldCount: item.qty || 1 } })
        ));
      }));
    }

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, logText } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    order.status = status;
    if (logText) order.logs.push({ time: new Date(), text: logText });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const now = new Date();
    if (order.cancelled) return res.status(400).json({ success: false, message: 'Order already cancelled.' });
    if (order.shippedAt && now >= order.shippedAt) return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already shipped.' });
    const { reason } = req.body;
    order.cancelled = true;
    order.logs.push({ time: now, text: reason ? `Order cancelled by customer: ${reason}` : 'Order cancelled by customer.' });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminUpdateStatus = async (req, res) => {
  try {
    const { status, deliveredAt: deliveredAtParam } = req.body;
    if (status === 'delivered') return res.status(400).json({ success: false, message: 'Delivered status is set automatically.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const now = new Date();
    const courierLabel = order.courier?.label || 'Courier';

    if (status === 'shipped' && !order.shippedAt) {
      order.shippedAt = now;
      if (deliveredAtParam) order.deliveredAt = new Date(deliveredAtParam);
      order.logs.push({ time: now, text: pick(LOG_POOLS.pickup).replace(/{courier}/g, courierLabel) });
    }

    order.status = status;
    order.logs.sort((a, b) => new Date(a.time) - new Date(b.time));
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminAddLog = async (req, res) => {
  try {
    const { text, time } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Log text required.' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    order.logs.push({ text: text.trim(), time: time ? new Date(time) : new Date() });
    order.logs.sort((a, b) => new Date(a.time) - new Date(b.time));
    await order.save();
    pushNotification(order.user.toString(), {
      icon: 'package',
      title: 'Order Update',
      body: text.trim(),
    }).catch(() => {});
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminEditLog = async (req, res) => {
  try {
    const { text, time } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const idx = Number(req.params.index);
    if (idx < 0 || idx >= order.logs.length) return res.status(404).json({ success: false, message: 'Log not found.' });
    if (text !== undefined) order.logs[idx].text = text.trim();
    if (time !== undefined) order.logs[idx].time = new Date(time);
    order.logs.sort((a, b) => new Date(a.time) - new Date(b.time));
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminDeleteLog = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const idx = Number(req.params.index);
    if (idx < 0 || idx >= order.logs.length) return res.status(404).json({ success: false, message: 'Log not found.' });
    order.logs.splice(idx, 1);
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminCancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.cancelled) return res.status(400).json({ success: false, message: 'Order already cancelled.' });
    order.cancelled = true;
    order.logs.push({
      time: new Date(),
      text: reason?.trim() ? `Order cancelled by admin: ${reason.trim()}` : 'Order cancelled by admin.',
    });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createOrder, getOrders, updateOrderStatus, cancelOrder, adminGetOrders, adminUpdateStatus, adminAddLog, adminEditLog, adminDeleteLog, adminCancelOrder };
