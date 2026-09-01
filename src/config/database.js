import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("Falta MONGO_URL en el archivo .env");
  }

  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB conectado");
};

export default connectDB;
