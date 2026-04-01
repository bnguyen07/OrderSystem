# STAGE 1: Build the Application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy specifically the .csproj files first to cache the Nuget downloads!
# This makes building your image 10x faster next time.
COPY ["OrderSystem.Api/OrderSystem.Api.csproj", "OrderSystem.Api/"]
RUN dotnet restore "OrderSystem.Api/OrderSystem.Api.csproj"

# Copy the rest of the actual C# code and compile it
COPY . .
WORKDIR "/app/OrderSystem.Api"
RUN dotnet build "OrderSystem.Api.csproj" -c Release -o /app/build

# Publish it (zipping it down into a tiny runnable file)
RUN dotnet publish "OrderSystem.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false


# STAGE 2: Run the Application (The Runtime Container)
# We throw away the 1GB SDK and use the microscopic ASP.NET Runtime!
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Open the port so Windows can talk to it
EXPOSE 8080

# The exact command Docker runs the instant the container turns on
ENTRYPOINT ["dotnet", "OrderSystem.Api.dll"]
