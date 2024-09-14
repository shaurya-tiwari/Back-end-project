import mongoose, { Schema } from "mongoose";
// installinng bcrypt - it hash our passwords ,decrypt encrypted passwords
// installing JWTwebtokens -securly transfer data over the web (between two parties).
// jwt=this is a barrier token
import bcrypt from "bcrypt";
import jwt from "jwtwebtokens";
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverimage: {
      type: String,
    },
    watchhistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    passwords: {
      type: String,
      required: [true, "passsword is required"],
    },
    refreshtoken: {
      type: String,
    },
  },
  { timestamps: true }
);
// using pre hooks for encrytption , pre- its a method , middleware function are executed on after onother when each middleware calls (next.) (doing something just before the data is going to be to save .like encrypting the password )
userSchema.pre("save", async function (next) {
  if (!this.ismodified("password")) return next();
  this.password = bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods,
  (ispasswordcorrect = async function (passsword) {
    return await bcrypt.compare(passsword, this.password);
  });
userSchema.methods.generateAccessToken = function () {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  )
};
export const User = mongoose.model("User", userSchema);
