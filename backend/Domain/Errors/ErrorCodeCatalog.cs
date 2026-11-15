namespace Domain.Errors
{
    /// <summary>
    /// Maps each domain error code to its localized resx key.
    /// The Message.vi.resx / Message.en.resx files own the actual copy.
    /// </summary>
    public static class ErrorCodeCatalog
    {
        private static readonly IReadOnlyDictionary<string, string> MessageKeys =
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                [ErrorCode.BadRequest] = "Error.BadRequest",
                [ErrorCode.NotFound] = "Error.NotFound",
                [ErrorCode.Forbidden] = "Error.Forbidden",
                [ErrorCode.ValidationFailed] = "Error.ValidationFailed",
                [ErrorCode.UnprocessableEntity] = "Error.UnprocessableEntity",
                [ErrorCode.TooManyRequests] = "Error.TooManyRequests",
                [ErrorCode.Timeout] = "Error.TimedOut",
                [ErrorCode.ServiceUnavailable] = "Error.ServiceUnavailable",
                [ErrorCode.InternalError] = "Error.Unexpected",
                [ErrorCode.RateLimited] = "Error.RateLimitedDetail",

                [ErrorCode.AuthInvalidCredentials] = "Auth.InvalidCredentials",
                [ErrorCode.AuthAccountSuspended] = "Auth.AccountSuspended",
                [ErrorCode.AuthEmailNotVerified] = "Auth.EmailNotVerified",
                [ErrorCode.AuthEmailExists] = "Auth.EmailExists",
                [ErrorCode.AuthPhoneExists] = "Auth.PhoneExists",
                [ErrorCode.AuthAccountCannotRegister] = "Auth.AccountCannotRegister",
                [ErrorCode.AuthInvalidOtp] = "Auth.InvalidOtp",
                [ErrorCode.AuthOtpTooManyAttempts] = "Auth.OtpTooManyAttempts",
                [ErrorCode.AuthAlreadyVerified] = "Auth.AlreadyVerified",
                [ErrorCode.AuthPasswordRequired] = "Auth.PasswordRequired",
                [ErrorCode.AuthGoogleLinkedOther] = "Auth.GoogleLinkedOther",
                [ErrorCode.AuthRefreshInvalid] = "Auth.RefreshInvalid",
                [ErrorCode.AuthRefreshRevoked] = "Auth.RefreshRevoked",
                [ErrorCode.AuthRequired] = "Auth.AuthenticationRequired",
                [ErrorCode.AuthGoogleNotConfigured] = "Auth.GoogleNotConfigured",
                [ErrorCode.AuthGoogleEmailNotVerified] = "Auth.GoogleEmailNotVerified",
                [ErrorCode.AuthGoogleNoEmail] = "Auth.GoogleNoEmail",
                [ErrorCode.AuthGoogleInvalid] = "Auth.GoogleInvalid",
                [ErrorCode.AuthGoogleUnavailable] = "Auth.GoogleUnavailable",
                [ErrorCode.AuthEmailNotConfigured] = "Auth.EmailNotConfigured",
                [ErrorCode.AuthEmailUnavailable] = "Auth.EmailUnavailable",
                [ErrorCode.AuthCurrentPasswordRequired] = "Auth.CurrentPasswordRequired",
                [ErrorCode.AuthCurrentPasswordWrong] = "Auth.CurrentPasswordWrong",
                [ErrorCode.AuthNewPasswordInvalid] = "Auth.NewPasswordInvalid",

                [ErrorCode.MediaUrlRequired] = "Media.UrlRequired",
                [ErrorCode.MediaInvalidUrl] = "Media.InvalidUrl",
                [ErrorCode.MediaNotFound] = "Media.NotFound",
                [ErrorCode.MediaStorageNotConfigured] = "Media.StorageNotConfigured",
                [ErrorCode.MediaUploadUnavailable] = "Media.UploadUnavailable",

                [ErrorCode.NotificationNotFound] = "Notification.NotFound",

                [ErrorCode.IdempotencyMissingKey] = "Idempotency.MissingKey",
                [ErrorCode.IdempotencyInProgress] = "Idempotency.InProgress",
                [ErrorCode.IdempotencyPayloadMismatch] = "Idempotency.PayloadMismatch",

                [ErrorCode.DbUniqueViolation] = "Db.UniqueViolation",
                [ErrorCode.DbForeignKeyViolation] = "Db.ForeignKeyViolation",
                [ErrorCode.DbRequiredField] = "Db.NotNullViolation",
                [ErrorCode.DbCheckViolation] = "Db.CheckViolation",
                [ErrorCode.DbConcurrencyConflict] = "Db.ConcurrencyConflict",

                [ErrorCode.UserCannotActivateBanned] = "Domain.UserCannotActivateBanned",
                [ErrorCode.UserFullNameRequired] = "Domain.UserFullNameRequired",
                [ErrorCode.UserPasswordRequired] = "Domain.UserPasswordRequired",
                [ErrorCode.UserExternalTokenExists] = "Domain.UserExternalTokenExists",
                [ErrorCode.UserExternalTokenMissing] = "Domain.UserExternalTokenMissing",
                [ErrorCode.AddressNotFound] = "Address.NotFound",
                [ErrorCode.BookPageExists] = "Domain.BookPageExists",
                [ErrorCode.BookPageVersionConflict] = "Domain.BookPageVersionConflict",
                [ErrorCode.CartBookNotFound] = "Domain.CartBookNotFound",
                [ErrorCode.OrderSupplierAlreadyAssigned] = "Domain.OrderSupplierAlreadyAssigned",
                [ErrorCode.OrderForceReasonRequired] = "Domain.OrderForceReasonRequired",
                [ErrorCode.OrderInvalidTransition] = "Domain.OrderInvalidTransition",
                [ErrorCode.OrderReturnAlreadyRequested] = "Domain.OrderReturnAlreadyRequested",
                [ErrorCode.OrderReturnNotRequested] = "Domain.OrderReturnNotRequested",
                [ErrorCode.OrderDefectAlreadyReported] = "Domain.OrderDefectAlreadyReported",
                [ErrorCode.OrderDefectNotReported] = "Domain.OrderDefectNotReported",
                [ErrorCode.CouponUsageLimitReached] = "Domain.CouponUsageLimitReached",
                [ErrorCode.SupplierBanReasonRequired] = "Domain.SupplierBanReasonRequired",
                [ErrorCode.FinancePeriodFormat] = "Domain.FinancePeriodFormat",
                [ErrorCode.MaintenanceEndAfterStart] = "Domain.MaintenanceEndAfterStart",
                [ErrorCode.MaintenanceTooLong] = "Domain.MaintenanceTooLong",
                [ErrorCode.ExpenseAmountPositive] = "Domain.ExpenseAmountPositive",
                [ErrorCode.CashflowAmountPositive] = "Domain.CashflowAmountPositive",
                [ErrorCode.IncomeSaleNotNegative] = "Domain.IncomeSaleNotNegative"
            };

        public static string GetMessageKey(string code)
            => MessageKeys.TryGetValue(code, out var key) ? key : "Error.Unexpected";
    }
}
