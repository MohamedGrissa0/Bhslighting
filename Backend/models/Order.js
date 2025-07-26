const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    products: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: {
          type: String,
        },
        image: {
          type: String,
        },
        price: {
          type: Number,
        },
        discountPrice: {
          type: Number,
        },
        quantity: {
          type: Number,
        },
        stock: {
          type: Number,
        },
        variants: {
          Size: {
            type: String,
          },
          Color: {
            type: String,
          },
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "   "],
      default: "pending",
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
