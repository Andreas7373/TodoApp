using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace StatsService.Controllers;

[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public StatsController(IHttpClientFactory factory)
    {
        _httpClient = factory.CreateClient("TaskService");
    }

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        var tasks = await _httpClient
            .GetFromJsonAsync<List<TodoTaskDto>>("api/tasks");

        if (tasks == null)
            return StatusCode(502);

        return Ok(new
        {
            TotalTasks = tasks.Count,
            CompletedTasks = tasks.Count(t => t.IsCompleted),
            PendingTasks = tasks.Count(t => !t.IsCompleted)
        });
    }
}

public record TodoTaskDto(
    int Id,
    string Title,
    bool IsCompleted
);