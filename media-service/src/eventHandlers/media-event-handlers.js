const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  const { postId, mediaIds } = event;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

    // Execute all deletion operations concurrently
    const deleteOperations = mediaToDelete.map(async (media) => {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Deleted media ${media._id} associated with this deleted post ${postId}`
      );
    });

    await Promise.all(deleteOperations);

    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    logger.error(e, "Error occurred while deleting media");
  }
};

module.exports = { handlePostDeleted };
