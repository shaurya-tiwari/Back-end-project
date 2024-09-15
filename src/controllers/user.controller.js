import { asychandler } from "../utils/asynchandler.js";
import { APIerror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/apiresponse.js";
const registeruser = asychandler(async (req, res) => {
  // get user details
  // validation -not empty or blank
  // user already registered or exist thorugh username or email
  // check for images and avatar
  // upload on cloudinary and one more check fot avatar
  // create object ,create entry in database
  // remove password and refresh token feild from response
  // check for user creation
  // return res

  const { username, fullname, email, password } = req.body;
  console.log("EMAILL :", email);
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new APIerror(400, "All fields are required");
  }
  const existeduser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existeduser) {
    throw new APIerror(409, "User with email and username is already exist");
  }
  const avatarlocalpath = req.files?.avatar[0]?.path;
  const coverimagelocalpath = req.files?.coverimage[0]?.path;
  if (!avatarlocalpath) {
    throw new APIerror(400, "Please upload avatar");
  }
  const avatar = await uploadoncloudinary(avatarlocalpath);
  const coverimage = await uploadoncloudinary(coverimagelocalpath);
  if (!avatar) {
    throw new APIerror(400, "Error while uploading avatar on cloudinary");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })
  const createduser=User.findById(user._id).select(
    // this fields are not sent.
    "-password -refreshtoken"
  )
  if(!createduser){
    throw new APIerror(500,"Error while register the user")
  }
  return res.status(200).json(
    new APIresponse(200,createduser,"user registered successfully")
  )
})

export { registeruser }
