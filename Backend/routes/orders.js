const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendConfirmationEmail = async (order) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Calculate subtotal here to avoid errors if not saved in DB
  const subtotal = order.products.reduce((acc, p) => {
    const price = p.discountPrice || p.price;
    return acc + price * p.quantity;
  }, 0);

  const productList = order.products
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px 0;">${p.name} x ${p.quantity}</td>
        <td style="padding: 10px 0; text-align: right;">${(p.discountPrice || p.price).toFixed(2)} TND</td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #eee;">
    <div style="padding: 20px 30px; background-color: #f8f9fa; border-bottom: 1px solid #ddd;">
      <h2 style="margin: 0; font-size: 18px;">Confirmation de commande <span style="color: #2e6138;">#${order._id}</span></h2>
      <p style="font-size: 13px; margin-top: 4px;">${order.date}</p>
    </div>

    <div style="padding: 30px;">
      <p>Bonjour <strong>${order.clientName}</strong>,</p>
      <p style="color: #2e6138; margin-top: 0;">Merci pour votre confiance et votre achat chez <strong>Bhslighting</strong> !</p>

      <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px;">Détails de votre commande</h3>
      
      <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
        ${productList}
      </table>

      <div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 15px;">
        <p style="margin: 4px 0;">Sous-total HT: <strong>${subtotal.toFixed(2)} TND</strong></p>
        <p style="margin: 4px 0;">Frais de livraison: <strong>${order.shippingCost?.toFixed(2) ?? '7.00'} TND</strong></p>
        <p style="margin: 10px 0; font-weight: bold; font-size: 16px;">Total TTC: <span style="color: #2e6138;">${order.totalAmount.toFixed(2)} TND</span></p>
      </div>

      <h3 style="margin-top: 30px; font-size: 16px;">Suivi de commande</h3>
      <p style="font-size: 14px;">Votre commande est en cours de préparation. Nous vous informerons par email dès que votre colis sera expédié.</p>
      <p style="font-size: 14px;">Pour toute question, vous pouvez répondre à cet email ou nous contacter au <strong>12 345 678</strong>.</p>
    </div>

    <div style="padding: 20px 30px; font-size: 13px; color: #888; text-align: center; background-color: #f8f9fa;">
      <p style="margin: 0;">À bientôt,<br><strong>L'équipe bhslighting</strong></p>
      <p style="margin-top: 10px; font-size: 11px;">Cet email est envoyé automatiquement, merci de ne pas y répondre directement.</p>
      <p style="font-size: 11px;">© 2025 bhslighting. Tous droits réservés.</p>
    </div>
  </div>
`;

  const mailOptions = {
    from: `"bhslighting" <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: `Confirmation de commande #${order._id}`,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Create a new order
router.post('/', async (req, res) => {
  try {
    const {
      clientName,
      email,
      city,
      phoneNumber,
      shippingAddress,
      totalAmount,
      products,
      paymentStatus,
      shippingCost,
      code,
      date,
    } = req.body;

    if (
      !clientName ||
      !email ||
      !products ||
      !totalAmount ||
      !shippingAddress ||
      !city ||
      !phoneNumber
    ) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const newOrder = new Order({
      clientName,
      email,
      city,
      phoneNumber,
      shippingAddress,
      totalAmount,
      products,
      paymentStatus,
      status: 'pending',
      shippingCost: shippingCost || 0,
      code: code || 'N/A',
      date: date || new Date().toLocaleDateString(),
    });

    const savedOrder = await newOrder.save();

    if (email) {
      await sendConfirmationEmail(savedOrder);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Update an order
router.put('/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Delete an order
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
