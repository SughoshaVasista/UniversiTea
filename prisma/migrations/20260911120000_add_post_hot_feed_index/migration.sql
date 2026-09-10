CREATE INDEX "Post_communityId_status_score_createdAt_idx"
  ON "Post"("communityId", "status", "score", "createdAt");
