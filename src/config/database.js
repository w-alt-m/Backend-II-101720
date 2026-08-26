import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Falta MONGO_URI en el archivo .env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB conectado");
};

export default connectDB;
