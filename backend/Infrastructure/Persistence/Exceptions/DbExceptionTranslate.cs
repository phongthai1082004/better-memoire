using Application.Exceptions;
using Domain.Enums.Persistence;
using Domain.Errors;
using Domain.Exceptions.Common;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Infrastructure.Persistence.Exceptions
{
    public class DbExceptionTranslate : IDbExceptionTranslator
    {
        public DbErrorCode GetErrorCode(Exception exception)
        {
            var pgEx = ExtractPostgresException(exception);
            if (pgEx is null)
            {
                return DbErrorCode.None;
            }

            return pgEx.SqlState switch
            {
                PostgresErrorCodes.UniqueViolation => DbErrorCode.UniqueViolation,
                PostgresErrorCodes.ForeignKeyViolation => DbErrorCode.ForeignKeyViolation,
                PostgresErrorCodes.NotNullViolation => DbErrorCode.NotNullViolation,
                PostgresErrorCodes.CheckViolation => DbErrorCode.CheckViolation,
                PostgresErrorCodes.DeadlockDetected => DbErrorCode.Deadlock,
                PostgresErrorCodes.QueryCanceled => DbErrorCode.Timeout,
                _ => DbErrorCode.Unknown
            };
        }

        public Exception Translate(Exception exception)
        {
            var code = GetErrorCode(exception);

            if (code == DbErrorCode.UniqueViolation)
            {
                var pgEx = ExtractPostgresException(exception);
                if (pgEx?.ConstraintName == "IX_users_PhoneNumber")
                    return new ConflictException(ErrorCode.AuthPhoneExists, exception);

                if (pgEx?.ConstraintName == "IX_users_Email")
                    return new ConflictException(ErrorCode.AuthEmailExists, exception);
            }

            return code switch
            {
                DbErrorCode.UniqueViolation => new ConflictException(ErrorCode.DbUniqueViolation, exception),
                DbErrorCode.ForeignKeyViolation => new BadRequestException(ErrorCode.DbForeignKeyViolation, exception),
                DbErrorCode.NotNullViolation => new BadRequestException(ErrorCode.DbRequiredField, exception),
                DbErrorCode.CheckViolation => new BadRequestException(ErrorCode.DbCheckViolation, exception),
                DbErrorCode.Deadlock => new TransientFailureException(ErrorCode.DbConcurrencyConflict, exception),
                DbErrorCode.ConcurrencyViolation => new ConflictException(ErrorCode.DbConcurrencyConflict, exception),
                _ => exception
            };
        }

        private static PostgresException? ExtractPostgresException(Exception exception)
        {
            if (exception is PostgresException pgEx)
            {
                return pgEx;
            }

            if (exception is DbUpdateException dbEx && dbEx.InnerException is PostgresException innerPgEx)
            {
                return innerPgEx;
            }

            return exception.InnerException as PostgresException;
        }
    }
}
