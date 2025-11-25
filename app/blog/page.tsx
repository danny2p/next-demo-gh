import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Calendar, User } from 'lucide-react';

/**
 * CONFIGURATION
 */
const WORDPRESS_GRAPHQL_ENDPOINT = 'https://dev-dp-wp-ap.pantheonsite.io/wp/graphql';

/**
 * GRAPHQL QUERIES
 */
const GET_POST_SLUGS_QUERY = `
  query GetPostSlugs {
    posts(first: 100) {
      nodes {
        slug
      }
    }
  }
`;

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

/**
 * HELPER: Fetch all slugs for Static Site Generation (SSG)
 */
export async function generateStaticParams() {
  try {
    const res = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: GET_POST_SLUGS_QUERY }),
    });
    const json = await res.json();
    
    if (!json.data?.posts?.nodes) {
        console.warn("[NextWP] No posts found during static generation.");
        return [];
    }

    // Return array of objects: [{ slug: 'post-1' }, { slug: 'post-2' }]
    return json.data.posts.nodes.map((post: { slug: string }) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('[NextWP] Error fetching slugs for SSG:', error);
    return [];
  }
}

/**
 * HELPER: Fetch Single Post Data
 */
async function getPost(slug: string): Promise<Post | null> {
  console.log(`[NextWP] Fetching post for slug: "${slug}"...`);

  try {
    const res = await fetch(WORDPRESS_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_SINGLE_POST_QUERY,
        variables: { slug },
      }),
      next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
    });

    const json = await res.json();
    
    if (json.errors) {
        console.error(`[NextWP] GraphQL Error for slug "${slug}":`, json.errors);
        return null;
    }
    
    if (!json.data?.post) {
        console.error(`[NextWP] No post found for slug "${slug}"`);
        return null;
    }

    console.log(`[NextWP] Successfully fetched "${slug}"`);
    return json.data.post;
  } catch (error) {
    console.error(`[NextWP] Network error fetching slug "${slug}":`, error);
    return null;
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
      </div>
    </div>
  </nav>
);

/**
 * COMPONENT: Footer
 */
const Footer = () => (
  <footer className="bg-white border-t border-gray-200 mt-20 py-12">
    <div className="max-w-6xl mx-auto px-4 text-center">
      <p className="text-slate-500 text-sm">Built with Next.js & WordPress.</p>
    </div>
  </footer>
);

/**
 * MAIN PAGE COMPONENT
 * Updated for Next.js 15: params is now a Promise
 */
export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
  // Await the params object (Required in Next.js 15)
  const params = await props.params;
  const { slug } = params;

  const post = await getPost(slug);

  if (!post) {
    notFound(); // Returns the 404 page
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Back Button */}
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
          
          {/* Featured Image */}
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
            
            {/* Category Label */}
            {post.categories?.nodes[0] && (
               <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-6 inline-block uppercase tracking-wide">
                  {post.categories.nodes[0].name}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-tight">
              {post.title}
            </h1>

            {/* Meta Data */}
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

            {/* Post Content */}
            <div 
              className="prose prose-lg prose-slate max-w-none 
                prose-headings:font-bold prose-headings:text-slate-900 
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />
          </div>
        </article>

      </main>
      
      <Footer />
    </div>
  );
}