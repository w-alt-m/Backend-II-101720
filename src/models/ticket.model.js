import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    status: {
      type: String,
      enum: ["confirmed", "pending", "cancelled"],
      default: "confirmed"
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "La cantidad debe ser mayor a 0"]
    },
    reservationCode: {
      type: String,
      required: true,
      unique: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

ticketSchema.index({ user: 1, event: 1 });
ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ reservationCode: 1 });

export default mongoose.model("Ticket", ticketSchema);
