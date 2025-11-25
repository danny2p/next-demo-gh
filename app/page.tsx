import Link from 'next/link';
import { BookOpen, Calendar } from 'lucide-react';

/**
 * CONFIGURATION
 */
const WORDPRESS_GRAPHQL_ENDPOINT = 'https://dev-dp-wp-ap.pantheonsite.io/wp/graphql';

const GET_POSTS_QUERY = `
  query GetPosts {
    posts(first: 12) {
      nodes {
        id
        slug
        title
        excerpt
        date
        author {
          node {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
          }
        }
        categories {
          nodes {
            name
            slug
          }
        }
      }
    }
  }
`;

/**
 * TYPES (Optional, helpful for TypeScript)
 */
type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: { node: { name: string } };
  featuredImage?: { node: { sourceUrl: string } };
  categories?: { nodes: { name: string; slug: string }[] };
};

/**
 * HELPER: Data Fetching (Runs on Server)
 */
async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_POSTS_QUERY }),
      // ISR: Revalidate data every 60 seconds
      next: { revalidate: 60 },
    });

    const json = await res.json();
    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      return [];
    }
    return json.data.posts.nodes;
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

/**
 * HELPER: Date Formatter
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * COMPONENT: Navigation
 * (In a real app, this often lives in src/app/layout.tsx)
 */
const Navbar = () => (
  <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <Link 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl text-slate-900 tracking-tight hover:opacity-80 transition-opacity"
        >
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <BookOpen size={20} />
          </div>
          <span>NextWP<span className="text-blue-600">.</span></span>
        </Link>
        
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-blue-600 transition-colors hidden sm:block">About</a>
          <a href="#" className="hover:text-blue-600 transition-colors hidden sm:block">Newsletter</a>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all text-sm font-semibold">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  </nav>
);

/**
 * COMPONENT: Footer
 * (In a real app, this often lives in src/app/layout.tsx)
 */
const Footer = () => (
  <footer className="bg-white border-t border-gray-200 mt-20 py-12">
    <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-slate-900 tracking-tight mb-6">
            <BookOpen size={20} className="text-blue-600" />
            <span>NextWP</span>
        </div>
        <p className="text-slate-500 text-sm mb-6">
            Built with Next.js, GraphQL and WordPress.
        </p>
        <div className="flex justify-center gap-6 text-slate-400">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Twitter</a>
        </div>
    </div>
  </footer>
);

/**
 * COMPONENT: Post Card
 */
const PostCard = ({ post }: { post: Post }) => {
  const hasImage = post.featuredImage?.node?.sourceUrl;

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
      <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
        {hasImage ? (
          <img 
            src={post.featuredImage?.node?.sourceUrl} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen size={48} opacity={0.2} />
          </div>
        )}
        <div className="absolute top-4 left-4">
            {post.categories?.nodes[0] && (
                <span className="bg-white/90 backdrop-blur text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {post.categories.nodes[0].name}
                </span>
            )}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.date)}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        <div 
          className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1"
          dangerouslySetInnerHTML={{ __html: post.excerpt }} 
        />

        <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            {post.author?.node?.name?.charAt(0) || 'A'}
          </div>
          <span className="text-sm font-medium text-slate-700">
            {post.author?.node?.name || 'Anonymous'}
          </span>
        </div>
      </div>
    </article>
  );
};

/**
 * MAIN PAGE COMPONENT (Server Component)
 */
export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-blue-600 font-bold tracking-wider text-xs uppercase mb-2 block">Our Blog</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Insights & Stories
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
              Explore the latest news, updates, and deep dives from our team. Connected directly to WordPress via GraphQL.
          </p>
        </div>

        {/* Post Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="block h-full">
                <PostCard post={post} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">
            <p>No posts found or connection to WordPress failed.</p>
          </div>
        )}

      </main>
      
      <Footer />
    </div>
  );
}