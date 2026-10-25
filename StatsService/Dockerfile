FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY StatsService/StatsService.csproj StatsService/
RUN dotnet restore StatsService/StatsService.csproj

COPY StatsService/ StatsService/

RUN dotnet publish StatsService/StatsService.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "StatsService.dll"]