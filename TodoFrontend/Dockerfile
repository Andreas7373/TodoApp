FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY TodoFrontend/TodoFrontend.csproj TodoFrontend/
RUN dotnet restore TodoFrontend/TodoFrontend.csproj

COPY TodoFrontend/ TodoFrontend/

RUN dotnet publish TodoFrontend/TodoFrontend.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "TodoFrontend.dll"]