module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "10.0.212.141",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};
