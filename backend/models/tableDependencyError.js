class TableDependencyError extends Error {
  constructor(tableName) {
    super(`Database table "${tableName}" is not available. Run the latest database migrations and try again.`);
    this.name = 'TableDependencyError';
    this.statusCode = 503;
    this.tableName = tableName;
  }
}

const rethrowIfMissingTable = (error, tableName) => {
  if (error && (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146)) {
    throw new TableDependencyError(tableName);
  }

  throw error;
};

module.exports = {
  TableDependencyError,
  rethrowIfMissingTable,
};
