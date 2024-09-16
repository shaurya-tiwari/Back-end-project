import { asychandler } from "../utils/asynchandler.js";
import { APIerror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiresponse.js";
const registeruser = asychandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res


  const {fullname, email, username, passwords } = req.body
  //console.log("email: ", email);

  if (
      [fullname, email, username, passwords].some((field) => field?.trim() === "")
  ) {
      throw new APIerror(400, "All fields are required")
  }

  const existedUser = await User.findOne({
      $or: [{ username }, { email }]
  })

  if (existedUser) {
      throw new APIerror(409, "User with email or username already exists")
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverimagelocalpath;
  if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
      coverimagelocalpath = req.files.coverimage[0].path
  }
  

  if (!avatarLocalPath) {
      throw new APIerror(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverimage = await uploadOnCloudinary(coverimagelocalpath)

  if (!avatar) {
      throw new APIerror(400, "Avatar file is required")
  }
 

  const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverimage: coverimage?.url || "",
      email, 
      passwords,
      username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
      "-passwords -refreshToken"
  )

  if (!createdUser) {
      throw new APIerror(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
      new APIresponse(200, createdUser, "User registered Successfully")
  )

} )

export { registeruser };
