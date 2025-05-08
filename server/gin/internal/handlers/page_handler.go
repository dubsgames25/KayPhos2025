package handlers

import (
	"github.com/gin-gonic/gin"
)

func LoginPage(c *gin.Context) {
	c.File("./public/html/login.html")
}
func NewAccountPage(c *gin.Context) {
	c.File("./public/html/new-account.html")
}
func DashboardPage(c *gin.Context) {
	c.File("./public/html/dashboard.html")
}
func ManualFoodSearchPage(c *gin.Context) {
	c.File("./public/html/manual-food-search.html")
}
func AIFoodSearchPage(c *gin.Context) {
	c.File("./public/html/ai-food-search.html")
}
func UserDefineMealPage(c *gin.Context) {
	c.File("./public/html/user-define-meal.html")
}
func UserMealHistoryPage(c *gin.Context) {
	c.File("./public/html/user-meal-history.html")
}
func Settings(c *gin.Context) {
	c.File("./public/html/settings.html")
}
