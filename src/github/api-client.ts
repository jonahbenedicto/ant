import { ContributionCell } from '../core/types';

export interface GitHubUserContributionOptions {
  githubToken: string;
}

export async function getGitHubUserContribution(
  userName: string,
  options: GitHubUserContributionOptions
): Promise<ContributionCell[]> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                weekday
                date
              }
            }
          }
        }
      }
    }
  `;
  
  const variables = { login: userName };
  
  const response = await fetch('https://api.github.com/graphql', {
    headers: {
      'Authorization': `bearer ${options.githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'langtons-ant'
    },
    method: 'POST',
    body: JSON.stringify({ variables, query })
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  
  const responseData = await response.json() as { data?: any; errors?: any[] };
  const { data, errors } = responseData;
  
  if (errors?.[0]) {
    throw new Error(`GraphQL error: ${errors[0].message}`);
  }
  
  const weeks = data.user.contributionsCollection.contributionCalendar.weeks;
  
  // Map GitHub's string contribution levels to numeric values
  function mapContributionLevel(level: string): number {
    switch (level) {
      case 'NONE': return 0;
      case 'FIRST_QUARTILE': return 1;
      case 'SECOND_QUARTILE': return 2;
      case 'THIRD_QUARTILE': return 3;
      case 'FOURTH_QUARTILE': return 4;
      default: return 0;
    }
  }
  
  return weeks.flatMap((week: any, x: number) =>
    week.contributionDays.map((day: any) => ({
      x,
      y: day.weekday,
      date: day.date,
      count: day.contributionCount,
      level: mapContributionLevel(day.contributionLevel)
    }))
  );
}


