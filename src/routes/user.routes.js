import { Router } from "express";
import {
  loginuser,
  logoutuser,
  changeCurrentPassword,
  getCurrentuser,
  getuserchannelprofile,
  getwatchhistory,
  refreshAccessToken,
  registeruser,
  updateAccountdetails,
  updateuserAvatar,
  Updateusercoverimage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  // injecting middlewares
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registeruser
);

router.route("/login").post(loginuser);

router.route("/logout").post(verifyJWT, logoutuser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentuser);

router.route("/update-details").patch(verifyJWT, updateAccountdetails);

router .route("/avatar").patch(verifyJWT, upload.single("avatar"), updateuserAvatar);

router.route("/cover-image").patch(verifyJWT, upload.single("/coverimage"), Updateusercoverimage);

router.route("/c/:username").get(verifyJWT, getuserchannelprofile);

router.route("/history").get(verifyJWT, getwatchhistory);

export default router;
