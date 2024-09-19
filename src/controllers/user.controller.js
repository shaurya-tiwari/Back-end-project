import { APIerror } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";
import mongoose from "mongoose";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesToken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();

    user.refreshtoken = refreshtoken;
    // password is saved here .
    await user.save({ validateBeforeSave: false });

    return { accesToken, refreshtoken };
  } catch (error) {
    throw new APIerror(
      500,
      "something went wrong while generating refresh and acces tokens"
    );
  }
};

const registeruser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullname, email, username, passwords } = req.body;
  //console.log("email: ", email);

  if (
    [fullname, email, username, passwords].some((field) => field?.trim() === "")
  ) {
    throw new APIerror(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new APIerror(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverimagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverimage) &&
    req.files.coverimage.length > 0
  ) {
    coverimagelocalpath = req.files.coverimage[0].path;
  }

  if (!avatarLocalPath) {
    throw new APIerror(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverimagelocalpath);

  if (!avatar) {
    throw new APIerror(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    passwords,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-passwords -refreshtoken"
  );

  if (!createdUser) {
    throw new APIerror(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new APIresponse(200, createdUser, "User registered Successfully"));
});

// there is mistake in spelling of asynchandler.
const loginuser = asyncHandler(async (req, res) => {
  // taking request body form data
  // taking usernames and email
  // find user in database
  // check password
  // access and refresh token, and expiry expiry
  // sending  cookies
  const { email, username, passwords } = req.body;

  if (!username && !email) {
    throw new APIerror(400, "username or email is required");
  }
  // if (!email ||!username) {
  // if (!username || !email) {
  //   throw new APIerror(400, "username or email is required");
  // }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new APIerror(404, "user does not exist");
  }
  const ispasswordvalid = await user.ispasswordcorrect(passwords);

  if (!ispasswordvalid) {
    throw new APIerror(401, "invalid password");
  }
  const { accesToken, refreshtoken } = await generateAccessandRefreshTokens(
    user._id
  );

  const logedInuser = await User.findOne(user._id).select(
    "-passwords -refreshtoken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    // cookies are only modified by the server not form font-end
  };

  return res
    .status(200)
    .cookie("accesToken", accesToken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
      new APIresponse(
        200,
        { user: logedInuser, accesToken, refreshtoken },
        "user logged In succesfully."
      )
    );
});

const logoutuser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshtoken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
    // cookies are modified by the server not form font-end
  };
  return res
    .status(200)
    .clearCookie("accesToken", options)
    .clearCookie("refreshtoken", options)
    .json(new APIresponse(200, {}, "user logged out !"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingrefreshtoken =
    req.cookies.refreshtoken || req.body.refreshtoken;
  if (!incomingrefreshtoken) {
    throw new APIerror(401, "unauthorized request");
  }
  try {
    const decodedtoken = jwt.verify(
      incomingrefreshtoken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedtoken?._id);
    if (!user) {
      throw new APIerror(401, "invalid refresh token");
    }
    if (incomingrefreshtoken !== user?.refreshtoken) {
      throw new APIerror(401, "Refresh token expired or used ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accesToken, newRefreshtoken } =
      await generateAccessandRefreshTokens(user._id);
    return res
      .status(200)
      .cookie("accesToken", accesToken, options)
      .cookie("refreshToken", newRefreshtoken, options)
      .json(
        new APIresponse(
          200,
          { user: user, accesToken, refreshtoken: newRefreshtoken },
          "access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new APIerror(401, error?.message || "invalid access token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findOne(req.user?._id);
  const ispasswordcorrect = user.ispasswordcorrect(oldPassword);
  if (!ispasswordcorrect) {
    throw new APIerror(401, "Invalid old password");
  }
  user.passwords = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new APIresponse(200, {}, "Password changed successfully"));
});

const getCurrentuser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APIresponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountdetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new APIerror(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-passwords");
  return res
    .status(200)
    .json(new APIresponse(200, user, "Account details updated successfully"));
});

const updateuserAvatar = asyncHandler(async (req, res) => {
  const avatarlocalPath = req.file?.path;
  if (!avatarlocalPath) {
    throw new APIerror(400, " avatar file missing");
  }
  const avatar = await uploadOnCloudinary(avatarlocalPath);
  if (!avatar.url) {
    throw new APIerror(400, "Error while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-passwords");
  return res
    .status(200)
    .json(new APIresponse(200, user, "avatar image updated successfully"));
});

const Updateusercoverimage = asyncHandler(async (req, res) => {
  const coverimagelocalPath = req.file?.path;
  if (!coverimagelocalPath) {
    throw new APIerror(400, "cover image file missing");
  }
  const coverimage = await uploadOnCloudinary(coverimagelocalPath);
  if (!coverimage.url) {
    throw new APIerror(400, "Error while uploading image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverimage: coverimage.url,
      },
    },
    { new: true }
  ).select("-passwords");
  return res
    .status(200)
    .json(new APIresponse(200, user, "Cover image updated successfully"));
});



const getuserchannelprofile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new APIerror(400, "username is missing");
  }

  const channel = await User.aggregate([
    // aggeregstion pipelines
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // note: here everything is inlowercase and plural because of mongodb
        from: "subscriptions",
        localField: "_id",
        //  may be here is (s) will include try it then find next erorr
        foreignField: "channel",

        as: "subscribers",
      },
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
      $addFields: {
        subscribercounts: {
          $size: "$subscribers",
        },
        channelsubscribetocount: {
          $size: "$subscribedTo",
        },
        issubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
              then: true,
              else: false,
            },
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribercounts: 1,
        channelsubscribetocount: 1,
        issubscribed: 1,
        coverimage: 1,
        avatar: 1,
        email: 1,
      },
    },
    console.log(channel),
  ]);

  if (!channel?.length) {
    throw new APIerror(404, "Channel not exist");
  }

  return res
    .status(200)
    .json(
      new APIresponse(200, channel[0], "user channel successfully fetched !")
    );
});

const getwatchhistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchhistory",
        foreignField: "_id",
        as: "watchhistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields:{
              owner:{
                $first:"$owner",
              }
            }
          }
        ],
      },
    },
  ])
  return res
  .status(200)
  .json(new APIresponse(200, user[0], "user watch history successfully fetched!")); 
});

export {
  registeruser,
  loginuser,
  logoutuser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentuser,
  updateAccountdetails,
  updateuserAvatar,
  Updateusercoverimage,
  getuserchannelprofile,
  getwatchhistory,
};
