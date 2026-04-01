namespace OrderSystem.Api.Events
{
    // A C# "record" is absolutely perfect for distributed messaging!
    // It is immutable, meaning once this tiny piece of data is thrown into RabbitMQ, 
    // it mathematically cannot be mysteriously altered or corrupted.
    public record OrderSubmittedEvent(int UserId, List<int> ProductIds);
}
