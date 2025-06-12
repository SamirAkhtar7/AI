import userModel from "../models/user.model.js";

export const createUser = async ({ email, password,name }) => {
  if (!email || !password ||!name) {
    throw new Error("Email and password are reqired");
  }

const dupemail = await userModel.findOne({ email });
if (dupemail) {
  throw new Error("Email is already in use");
}

  const hashedPassword = await userModel.hashPassword(password);
  const user = await userModel.create({
    name,
    email,
    password: hashedPassword,
  });

  return user;
};

export const getAllUsers = async (userId) => {
  const users = await userModel.find(
    {
      _id: { $ne: userId },
    },
    { email: 1 }
  );
  return users;
};
