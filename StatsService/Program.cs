var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();

builder.Services.AddHttpClient("TaskService", client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["TaskService:BaseUrl"]!
    );
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalFrontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("LocalFrontend");
}

app.MapControllers();

app.Run();
