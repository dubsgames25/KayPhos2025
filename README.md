# KayPhos2025
Team 25056 Senior Design Capstone with full mobile/web application implemented
Web application in development for measuring potassium (K) and phosphorus
content in food from your smartphone.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

## Installation

### Instructions for OSX

1. Clone the repo:
   ```bash
   git clone https://github.com/kimsh02/kay-phos.git
   ```
2. Navigate to the project directory:
   ```bash
   cd kay-phos
   ```
3. Make sure you have Go installed:
   ```bash
   brew install go
   ```
### Instructions for Windows

TODO

## Usage

To start the server run the commands below in the root project directory.
```bash
go mod tidy
```
```bash
go run cmd/server/main.go
```

Visit http://localhost:8080/testpage to view the web application.

Additionaly, you can natively compile the web application by running the command below.
```bash
go build cmd/server/main.go
```

To run the executable, do this command.
```bash
./main
```

## Contributing

### Guidelines for contributing to the project:
- Clone the repo
- Create a new branch (`git checkout -b my-branch`)
- Submit a pull request
