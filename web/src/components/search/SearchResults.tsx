import * as React from "react"
import { SearchResult } from "@/types/search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface SearchResultsProps {
  results: SearchResult[]
  onResultClick?: (result: SearchResult) => void
  className?: string
}

export function SearchResults({
  results,
  onResultClick,
  className,
}: SearchResultsProps) {
  if (!results.length) {
    return (
      <div className={`text-center text-muted-foreground ${className}`}>
        No results found
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {results.map((result) => (
        <Card
          key={result.id}
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => onResultClick?.(result)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{result.title}</CardTitle>
              <Badge variant="secondary">
                {formatDistanceToNow(new Date(result.timestamp), {
                  addSuffix: true,
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{result.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 