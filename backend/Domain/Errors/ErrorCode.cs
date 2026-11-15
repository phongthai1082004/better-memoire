namespace Domain.Errors
{
    /// <summary>Stable API error codes owned by the domain.</summary>
    public static class ErrorCode
    {
        // Generic
        public const string BadRequest = "BAD_REQUEST";
        public const string NotFound = "NOT_FOUND";
        public const string Forbidden = "FORBIDDEN";
        public const string ValidationFailed = "VALIDATION_FAILED";
        public const string UnprocessableEntity = "UNPROCESSABLE_ENTITY";
        public const string TooManyRequests = "TOO_MANY_REQUESTS";
        public const string Timeout = "REQUEST_TIMEOUT";
        public const string ServiceUnavailable = "SERVICE_UNAVAILABLE";
        public const string InternalError = "INTERNAL_ERROR";
        public const string RateLimited = "RATE_LIMITED";

        // Authentication
        public const string AuthInvalidCredentials = "AUTH_INVALID_CREDENTIALS";
        public const string AuthAccountSuspended = "AUTH_ACCOUNT_SUSPENDED";
        public const string AuthEmailNotVerified = "AUTH_EMAIL_NOT_VERIFIED";
        public const string AuthEmailExists = "AUTH_EMAIL_EXISTS";
        public const string AuthPhoneExists = "AUTH_PHONE_EXISTS";
        public const string AuthAccountCannotRegister = "AUTH_ACCOUNT_CANNOT_REGISTER";
        public const string AuthInvalidOtp = "AUTH_INVALID_OTP";
        public const string AuthOtpTooManyAttempts = "AUTH_OTP_TOO_MANY_ATTEMPTS";
        public const string AuthAlreadyVerified = "AUTH_ALREADY_VERIFIED";
        public const string AuthPasswordRequired = "AUTH_PASSWORD_REQUIRED";
        public const string AuthGoogleLinkedOther = "AUTH_GOOGLE_LINKED_OTHER";
        public const string AuthRefreshInvalid = "AUTH_REFRESH_INVALID";
        public const string AuthRefreshRevoked = "AUTH_REFRESH_REVOKED";
        public const string AuthRequired = "AUTH_REQUIRED";
        public const string AuthGoogleNotConfigured = "AUTH_GOOGLE_NOT_CONFIGURED";
        public const string AuthGoogleEmailNotVerified = "AUTH_GOOGLE_EMAIL_NOT_VERIFIED";
        public const string AuthGoogleNoEmail = "AUTH_GOOGLE_NO_EMAIL";
        public const string AuthGoogleInvalid = "AUTH_GOOGLE_INVALID";
        public const string AuthGoogleUnavailable = "AUTH_GOOGLE_UNAVAILABLE";
        public const string AuthEmailNotConfigured = "AUTH_EMAIL_NOT_CONFIGURED";
        public const string AuthEmailUnavailable = "AUTH_EMAIL_UNAVAILABLE";
        public const string AuthCurrentPasswordRequired = "AUTH_CURRENT_PASSWORD_REQUIRED";
        public const string AuthCurrentPasswordWrong = "AUTH_CURRENT_PASSWORD_WRONG";
        public const string AuthNewPasswordInvalid = "AUTH_NEW_PASSWORD_INVALID";

        // Media
        public const string MediaUrlRequired = "MEDIA_URL_REQUIRED";
        public const string MediaInvalidUrl = "MEDIA_INVALID_URL";
        public const string MediaNotFound = "MEDIA_NOT_FOUND";
        public const string MediaStorageNotConfigured = "MEDIA_STORAGE_NOT_CONFIGURED";
        public const string MediaUploadUnavailable = "MEDIA_UPLOAD_UNAVAILABLE";

        // Notifications
        public const string NotificationNotFound = "NOTIFICATION_NOT_FOUND";

        // Idempotency
        public const string IdempotencyMissingKey = "IDEMPOTENCY_MISSING_KEY";
        public const string IdempotencyInProgress = "IDEMPOTENCY_IN_PROGRESS";
        public const string IdempotencyPayloadMismatch = "IDEMPOTENCY_PAYLOAD_MISMATCH";

        // Persistence
        public const string DbUniqueViolation = "DB_UNIQUE_VIOLATION";
        public const string DbForeignKeyViolation = "DB_FOREIGN_KEY_VIOLATION";
        public const string DbRequiredField = "DB_REQUIRED_FIELD";
        public const string DbCheckViolation = "DB_CHECK_VIOLATION";
        public const string DbConcurrencyConflict = "DB_CONCURRENCY_CONFLICT";

        // Domain rules
        public const string UserCannotActivateBanned = "USER_CANNOT_ACTIVATE_BANNED";
        public const string UserFullNameRequired = "USER_FULL_NAME_REQUIRED";
        public const string UserPasswordRequired = "USER_PASSWORD_REQUIRED";
        public const string UserExternalTokenExists = "USER_EXTERNAL_TOKEN_EXISTS";
        public const string UserExternalTokenMissing = "USER_EXTERNAL_TOKEN_MISSING";
        public const string AddressNotFound = "ADDRESS_NOT_FOUND";
        public const string BookPageExists = "BOOK_PAGE_EXISTS";
        public const string BookPageVersionConflict = "BOOK_PAGE_VERSION_CONFLICT";
        public const string CartBookNotFound = "CART_BOOK_NOT_FOUND";
        public const string OrderSupplierAlreadyAssigned = "ORDER_SUPPLIER_ALREADY_ASSIGNED";
        public const string OrderForceReasonRequired = "ORDER_FORCE_REASON_REQUIRED";
        public const string OrderInvalidTransition = "ORDER_INVALID_TRANSITION";
        public const string OrderReturnAlreadyRequested = "ORDER_RETURN_ALREADY_REQUESTED";
        public const string OrderReturnNotRequested = "ORDER_RETURN_NOT_REQUESTED";
        public const string OrderDefectAlreadyReported = "ORDER_DEFECT_ALREADY_REPORTED";
        public const string OrderDefectNotReported = "ORDER_DEFECT_NOT_REPORTED";
        public const string CouponUsageLimitReached = "COUPON_USAGE_LIMIT_REACHED";
        public const string SupplierBanReasonRequired = "SUPPLIER_BAN_REASON_REQUIRED";
        public const string FinancePeriodFormat = "FINANCE_PERIOD_FORMAT";
        public const string MaintenanceEndAfterStart = "MAINTENANCE_END_AFTER_START";
        public const string MaintenanceTooLong = "MAINTENANCE_TOO_LONG";
        public const string ExpenseAmountPositive = "EXPENSE_AMOUNT_POSITIVE";
        public const string CashflowAmountPositive = "CASHFLOW_AMOUNT_POSITIVE";
        public const string IncomeSaleNotNegative = "INCOME_SALE_NOT_NEGATIVE";
    }
}
