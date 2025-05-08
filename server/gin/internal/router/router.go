package router

import (
	"github.com/kimsh02/kay-phos/server/gin/internal/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kimsh02/kay-phos/server/gin/internal/handlers"
)

func NewRouter() *gin.Engine {
	// Set the router as the default one shipped with Gin
	router := gin.Default()
	expectedHosts := map[string]struct{}{
		"localhost:8080":      {},
		"server:8080":         {},
		"3.149.231.239:8080":  {},
		"kayphos.com":         {},
		"www.kayphos.com":     {},
		"kayphos.com:443":     {},
		"www.kayphos.com:443": {}, // just in case
	}

	// Setup Security Headers
	router.Use(func(c *gin.Context) {
		if _, ok := expectedHosts[c.Request.Host]; !ok {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid host header " + c.Request.Host})
			return
		}
		c.Header("X-Frame-Options", "DENY")
		c.Header("Content-Security-Policy", "default-src 'self'; connect-src *; font-src *; script-src-elem * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline';")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Header("Referrer-Policy", "strict-origin")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("Permissions-Policy", "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()")
		c.Next()
	})

	return router
}

func InitRoutes(router *gin.Engine, app *handlers.App) {

	// Set public entry routes
	router.GET("/", handlers.LoginPage)
	router.POST("/", handlers.MakeUserHandler(app.LoginUser))
	router.GET("/new-account/", handlers.NewAccountPage)
	router.POST("/new-account/", handlers.MakeUserHandler(app.CreateUser))

	// Set protected routes
	dashboard := router.Group("/dashboard/")
	{
		dashboard.Use(middleware.ValidateTokenMiddleware())
		dashboard.Use(func(c *gin.Context) {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
			c.Next()
		})
		dashboard.GET("/", handlers.DashboardPage)
		dashboard.GET("/manual-food-search/", handlers.ManualFoodSearchPage)
		dashboard.GET("/ai-food-search/", handlers.AIFoodSearchPage)
		dashboard.GET("/user-define-meal", handlers.UserDefineMealPage)
		dashboard.GET("/user-meal-history", handlers.UserMealHistoryPage)
		dashboard.GET("/foodcode", app.GetFoodCode)
		dashboard.GET("/api/user-meal-history", app.GetMealHistory)
		dashboard.DELETE("/user-meal-history", app.DeleteMealEntry)
		dashboard.GET("/search-food", app.SearchFood)
		dashboard.GET("/autocomplete", app.AutocompleteSuggestions)
		dashboard.GET("/logout", func(c *gin.Context) {
			//Clear session token
			c.SetCookie("token", "", -1, "/", "", false, true)
			c.Redirect(http.StatusFound, "/")
		})
		dashboard.GET("/settings", handlers.Settings)
		dashboard.GET("/api/user-info", app.GetCurrentUserInfo)
		dashboard.GET("/api/user-logged-meals", app.GetLoggedMeals)
		dashboard.GET("/api/nutrient-history", app.GetNutrientHistory)
		// fndds
		// update: support json requests
		// test
		dashboard.POST("/calculate-intake", app.CalculateIntake)
		dashboard.POST("/api/user-meal-history", app.InsertMealHistory)

	}

	// Invalid paths
	router.NoRoute(handlers.InvalidPath)
}

func InitStatic(router *gin.Engine) {
	// Serve frontend js files
	router.Static("/public/js", "./public/js")
	// Serve ico
	router.Static("/public/ico", "./public/ico")
	// Serve css
	router.Static("/public/css", "./public/css")
	// Serve images
	router.Static("/public/images", "./public/images")
}
