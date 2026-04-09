import { Book, Download, ExternalLink, Search, Filter, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export default function BooksReferences() {
  const courseBooks = [
    {
      id: 1,
      title: "Fundamentals of Physics",
      author: "David Halliday, Robert Resnick",
      course: "Physics 101",
      edition: "12th Edition",
      isbn: "978-1119716761",
      type: "Textbook",
      status: "Required",
      format: "PDF",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1732304720116-4195b021d8d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaHlzaWNzJTIwdGV4dGJvb2slMjBjb3ZlcnxlbnwxfHx8fDE3NTcwNDYxMjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      available: true
    },
    {
      id: 2,
      title: "Calculus: Early Transcendentals",
      author: "James Stewart",
      course: "Mathematics",
      edition: "9th Edition", 
      isbn: "978-1337613927",
      type: "Textbook",
      status: "Required",
      format: "PDF",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1588912914017-923900a34710?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXRoZW1hdGljcyUyMHRleHRib29rfGVufDF8fHx8MTc1Njk1NjczMnww&ixlib=rb-4.1.0&q=80&w=1080",
      available: true
    },
    {
      id: 3,
      title: "Organic Chemistry",
      author: "Paula Yurkanis Bruice",
      course: "Chemistry",
      edition: "8th Edition",
      isbn: "978-0134042282",
      type: "Textbook",
      status: "Required",
      format: "PDF",
      rating: 4.4,
      image: "https://images.unsplash.com/photo-1711185898441-f493426390cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVtaXN0cnklMjBib29rJTIwY292ZXJ8ZW58MXx8fHwxNzU3MDQ2MTMzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      available: true
    },
    {
      id: 4,
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      course: "Computer Science",
      edition: "4th Edition",
      isbn: "978-0262046305",
      type: "Textbook",
      status: "Required",
      format: "PDF",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1753939582692-6b01009b9cca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMHNjaWVuY2UlMjB0ZXh0Ym9va3xlbnwxfHx8fDE3NTcwNDYxMzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      available: true
    }
  ];

  const referenceBooks = [
    {
      id: 5,
      title: "The Feynman Lectures on Physics",
      author: "Richard P. Feynman",
      category: "Physics Reference",
      type: "Reference",
      status: "Supplementary",
      format: "PDF",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMHJlZmVyZW5jZSUyMGJvb2tzfGVufDF8fHx8MTc1NzA0NjEzOHww&ixlib=rb-4.1.0&q=80&w=1080",
      available: true
    },
    {
      id: 6,
      title: "Mathematical Methods in the Physical Sciences",
      author: "Mary L. Boas",
      category: "Mathematics Reference",
      type: "Reference",
      status: "Supplementary",
      format: "PDF",
      rating: 4.5,
      image: "https://images.unsplash.com/photo-1658563248961-62d39328d1a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWJyYXJ5JTIwYm9va3MlMjBzdGFja3xlbnwxfHx8fDE3NTY5MzcwNDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      available: true
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Required': return 'destructive';
      case 'Supplementary': return 'secondary';
      default: return 'default';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Books & References</h2>
        <p className="text-muted-foreground">Access your course textbooks and reference materials</p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search books by title, author, or ISBN..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Course Textbooks Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Course Textbooks</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <ImageWithFallback
                    src={book.image}
                    alt={`${book.title} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <Badge variant={getStatusBadgeVariant(book.status)} className="text-xs">
                    {book.status}
                  </Badge>
                  <CardTitle className="text-sm leading-tight">{book.title}</CardTitle>
                  <CardDescription className="text-xs">{book.author}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Course: {book.course}</div>
                  <div>Edition: {book.edition}</div>
                  <div>Format: {book.format}</div>
                </div>
                
                {renderStars(book.rating)}
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reference Books Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          <h3 className="text-xl font-semibold">Reference Materials</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {referenceBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <ImageWithFallback
                    src={book.image}
                    alt={`${book.title} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <Badge variant={getStatusBadgeVariant(book.status)} className="text-xs">
                    {book.status}
                  </Badge>
                  <CardTitle className="text-sm leading-tight">{book.title}</CardTitle>
                  <CardDescription className="text-xs">{book.author}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Category: {book.category}</div>
                  <div>Format: {book.format}</div>
                </div>
                
                {renderStars(book.rating)}
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Access Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Frequently accessed resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Book className="h-6 w-6" />
              <span>Digital Library</span>
              <span className="text-xs text-muted-foreground">Access online resources</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Download className="h-6 w-6" />
              <span>Download Center</span>
              <span className="text-xs text-muted-foreground">Manage downloads</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <ExternalLink className="h-6 w-6" />
              <span>External Resources</span>
              <span className="text-xs text-muted-foreground">Third-party materials</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}