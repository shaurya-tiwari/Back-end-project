import { APIerror } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesToken = user.generateAccessToken()
    const refreshtoken = user.generateRefreshToken()

    user.refreshtoken = refreshtoken
    // password is saved here .
    await user.save({ validateBeforeSave: false })

    return { accesToken, refreshtoken }

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
    username: username.toLowerCase()
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
  const { email, username, passwords } = req.body


  if (!username && !email)
   {
      throw new APIerror(400, "username or email is required")
  }
  // if (!email ||!username) {
  // if (!username || !email) {
  //   throw new APIerror(400, "username or email is required");
  // }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (!user) {
    throw new APIerror(404, "user does not exist");
  }
  const ispasswordvalid = await user.ispasswordcorrect(passwords);

  if (!ispasswordvalid) {
    throw new APIerror(401, "invalid password");
  }
  const { accesToken, refreshtoken } = await generateAccessandRefreshTokens(
    user._id
  )

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
const logoutuser = asyncHandler( async (req, res) => {
  
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshtoken: undefined,
      },
    },
    {
      new: true
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
    .clearCookie("refreshtoken",options)
    .json(new APIresponse(200, {}, "user logged out !"))
  })
  const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingrefreshtoken= req.cookies.refreshtoken|| req.body.refreshtoken
    if(!incomingrefreshtoken){
      throw new APIerror(401,"unauthorized request")
    }
 try {
   const decodedtoken=jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)
   const user=await User.findById(decodedtoken?._id)
   if(!user){
     throw new APIerror(401,"invalid refresh token")
   }
 if (incomingrefreshtoken !== user?.refreshtoken) {
   throw new APIerror(401,"Refresh token expired or used ") 
 }
 
 const options={
   httpOnly: true,
   secure: true,
   }
   const {accesToken,newRefreshtoken}=await generateAccessandRefreshTokens(user._id)
   return res
   .status(200)
   .cookie("accesToken",accesToken,options)
   .cookie("refreshToken",newRefreshtoken,options)
   .json(
     new APIresponse(
       200,
       { user: user, accesToken, refreshtoken: newRefreshtoken},
       "access token refreshed successfully"
     )
   )
 } catch (error) {
  throw new APIerror(401,error?.message || "invalid access token") 
 }

  })

export { registeruser, loginuser, logoutuser, refreshAccessToken };
