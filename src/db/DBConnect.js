import mongoose from "mongoose";

const MongoDBInsatnce = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb://localhost:27017/Auth`
    );
    console.log(`\n MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
export default MongoDBInsatnce;
