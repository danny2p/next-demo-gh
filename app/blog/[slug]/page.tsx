import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar, User, AlertTriangle } from 'lucide-react';

// --- FORCE DYNAMIC RENDERING ---
// This forces Next.js to render the page on every request (SSR), 
// bypassing static generation issues for debugging.
export const dynamic = 'force-dynamic'; 

/**
 * CONFIGURATION
 */
const WORDPRESS_GRAPHQL_ENDPOINT = 'https://dev-dp-wp-ap.pantheonsite.io/wp/graphql';

const GET_SINGLE_POST_QUERY = `
  query GetPost($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      id
      title
      content
      date
      excerpt
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
        }
      }
    }
  }
`;

/**
 * TYPES
 */
type Post = {
  id: string;
  title: string;
  content: string;
  date: string;
  excerpt: string;
  author: { node: { name: string } };
  featuredImage?: { node: { sourceUrl: string } };
  categories?: { nodes: { name: string }[] };
};

type APIResponse = {
  post: Post | null;
  error?: string;
  debugData?: any;
};

/**
 * HELPER: Fetch Single Post Data (With Debug Info)
 */
async function getPost(slug: string): Promise<APIResponse> {
  try {
    const res = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_SINGLE_POST_QUERY,
        variables: { slug },
      }),
      cache: 'no-store' // Ensure we always fetch fresh data
    });

    const json = await res.json();
    
    return {
      post: json.data?.post || null,
      error: json.errors ? JSON.stringify(json.errors) : undefined,
      debugData: json
    };
  } catch (error: any) {
    return {
      post: null,
      error: error.message,
      debugData: { error: 'Network request failed' }
    };
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

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
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-white border-t border-gray-200 mt-20 py-12">
    <div className="max-w-6xl mx-auto px-4 text-center">
      <p className="text-slate-500 text-sm">Built with Next.js & WordPress.</p>
    </div>
  </footer>
);

export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;

  // Fetch with debug info
  const { post, error, debugData } = await getPost(slug);

  // --- DEBUG VIEW: IF POST IS MISSING ---
  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-8">
        <Navbar />
        <main className="max-w-3xl mx-auto mt-10">
          <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 text-red-600 mb-6">
              <AlertTriangle size={32} />
              <h1 className="text-2xl font-bold">404 Debug: Post Not Found</h1>
            </div>
            
            <p className="text-slate-600 mb-6">
              The generic "Not Found" page was triggered. Here is the detailed technical reason why:
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide text-slate-500 mb-2">Requested Slug</h3>
                <code className="block bg-slate-100 p-3 rounded text-blue-700 font-mono text-sm border border-slate-200">
                  {slug}
                </code>
              </div>

              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide text-slate-500 mb-2">Endpoint Checked</h3>
                <code className="block bg-slate-100 p-3 rounded text-slate-700 font-mono text-xs break-all border border-slate-200">
                  {WORDPRESS_GRAPHQL_ENDPOINT}
                </code>
              </div>

              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide text-slate-500 mb-2">Raw GraphQL Response</h3>
                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>

              {error && (
                <div>
                   <h3 className="font-bold text-sm uppercase tracking-wide text-red-500 mb-2">Error Message</h3>
                   <div className="bg-red-50 text-red-800 p-4 rounded border border-red-100 text-sm font-mono">
                     {error}
                   </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-lg mb-2">Troubleshooting Tips:</h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                    <li><strong>Is this a Page?</strong> The current query only looks for <code>post()</code>. If this content is a "Page" in WordPress, it will return null.</li>
                    <li><strong>Is it Published?</strong> Drafts and private posts are hidden from the public GraphQL API unless you authenticate.</li>
                    <li><strong>Check the Slug:</strong> Does the slug in WordPress exactly match <code>{slug}</code>?</li>
                </ul>
                <div className="mt-6">
                    <Link href="/" className="text-blue-600 hover:underline font-medium">&larr; Back to Home</Link>
                </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- NORMAL VIEW: IF POST EXISTS ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link 
          href="/"
          className="group inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-8 transition-colors"
        >
          <div className="p-2 rounded-full bg-white border border-gray-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
              <ArrowLeft size={16} />
          </div>
          Back to Articles
        </Link>

        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {post.featuredImage?.node?.sourceUrl && (
            <div className="w-full aspect-video md:aspect-[21/9] relative overflow-hidden">
              <img 
                src={post.featuredImage.node.sourceUrl} 
                className="w-full h-full object-cover"
                alt={post.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>
          )}

          <div className="px-6 py-10 sm:px-12 sm:py-12">
            {post.categories?.nodes[0] && (
               <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-6 inline-block uppercase tracking-wide">
                  {post.categories.nodes[0].name}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 border-b border-gray-100 pb-8 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  <User size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {post.author?.node?.name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-slate-500">Author</span>
                </div>
              </div>
              
              <div className="hidden sm:block h-8 w-px bg-gray-200" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                   <Calendar size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">
                    {formatDate(post.date)}
                  </span>
                  <span className="text-xs text-slate-500">Published</span>
                </div>
              </div>
            </div>

            <div 
              className="prose prose-lg prose-slate max-w-none 
                prose-headings:font-bold prose-headings:text-slate-900 
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}