export const getHostUrl = (req, middlePath) => {
    return req.protocol + "://" + req.get("host") + "/images/" +`${middlePath}/`;
};
  