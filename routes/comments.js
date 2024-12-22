const express = require("express");
const Comment = require("../models/Comment");
const authenticate = require("../middleware/authenticate");
const Post = require("../models/Post"); // Ensure Post is imported

const router = express.Router();

// Add Comment
router.post("/:postId", authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = new Comment({
      content,
      user: req.user.id,
      post: req.params.postId,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get Comments
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).populate(
      "user",
      "name"
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
router.put("/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Check if the user is the comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    comment.content = req.body.content;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a Comment
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const post = await Post.findById(comment.post);

    // Allow deletion if the user is either the comment owner or the post owner
    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike a Comment
router.put("/:id/like", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const userId = req.user.id;

    if (comment.likes.includes(userId)) {
      // Unlike the comment
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like the comment
      comment.likes.push(userId);
    }

    await comment.save();
    res.json({ likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
