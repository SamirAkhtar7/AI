import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    trim: true,
    minLength: [3, "Name must be at least 3 characters long"],
    maxLenght: [20, "Name must not be longer than 20 charaters"],
  },
  email: {
    type: String,
    require: true,
    unique: true,
    trim: true,
    minLength: [6, "Email must be at least 6 characters long"],
    maxLenght: [50, "Email must not be longer than 50 charaters"],
  },
  password: {
    type: String,
    select: false,
  },
});

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};


userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


userSchema.methods.generateJWT = function () {
  return jwt.sign({ email: this.email }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};




const User = mongoose.model('user', userSchema);
export default User;