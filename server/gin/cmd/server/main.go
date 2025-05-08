package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kimsh02/kay-phos/server/gin/internal/handlers"
	"github.com/kimsh02/kay-phos/server/gin/internal/repositories"
	"github.com/kimsh02/kay-phos/server/gin/internal/router"
)

func main() {
	// Initialize db connection pool

	dbPool, err := repositories.NewDBConnectionPool()
	if err != nil {
		log.Println(err)
	} else {
		log.Println("DB connection successful.")
	}
	defer dbPool.Close()
	// Ping db to ensure connection for debug
	// pingErr := dbPool.Ping(context.Background())
	// if pingErr != nil {
	// 	log.Println(pingErr)
	// }

	// Init handler struct
	app := &handlers.App{
		DB:        dbPool,
		FnddsRepo: &repositories.Fndds{},
	}
	// Initialize router
	r := router.NewRouter()
	// Initialize static server
	r.LoadHTMLGlob("public/html/*.html")
	router.InitStatic(r)
	// Initialize APIs
	router.InitRoutes(r, app)

	// Initialize HTTP port
	httpPort := os.Getenv("API_PORT")
	if httpPort == "" {
		httpPort = "8080"
	}
	// Create server with timeout
	srv := &http.Server{
		Addr:    ":" + httpPort,
		Handler: r,
		// set timeout due CWE-400 - Potential Slowloris Attack
		ReadHeaderTimeout: 5 * time.Second,
	}
	// Make shutdown chan
	shutdownChan := make(chan bool, 1)
	// Start sever in a goroutine
	go func() {
		if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
			log.Printf("Failed to start server: %v", err)
		}
		log.Println("Stopped serving new connections.")
		shutdownChan <- true
	}()
	// Graceful shutdown on kill signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan
	shutdownCtx, shutdownRelease := context.WithTimeout(context.Background(), 3*time.Second)
	defer shutdownRelease()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("HTTP shutdown error: %v", err)
	}
	<-shutdownChan
	log.Println("Server shutting down...")

	// do not trust any proxies
	// r.SetTrustedProxies(nil)

	// set server to release mode
	// gin.SetMode(gin.ReleaseMode)
}
