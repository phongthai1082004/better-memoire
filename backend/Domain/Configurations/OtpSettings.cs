namespace Domain.Configurations
{
    public class OtpSettings
    {
        public int ExpiryMinutes { get; set; } = 15;
        public int MaxAttempts { get; set; } = 5;
        public int ResendCooldownSeconds { get; set; } = 60;
    }
}
