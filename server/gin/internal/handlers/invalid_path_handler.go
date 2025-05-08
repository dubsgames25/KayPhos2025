package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kimsh02/kay-phos/server/gin/internal/middleware"
)

/*
 * Handler for invalid paths
 */

func InvalidPath(c *gin.Context) {
	// Call token middleware
	// If user is not logged in, redirect to log in
	middleware.ValidateTokenMiddleware()(c)
	// Else, stay on current page
	if !c.IsAborted() {
		// log.Println("Redirect from invalid path.")
		// c.Redirect(http.StatusFound, c.Request.Referer())
		c.IndentedJSON(http.StatusBadRequest, gin.H{"error": "Invalid path."})
		return
	}
}
