export default function SiteNotFound() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50'>
      <h1 className='text-6xl font-black text-gray-900'>404</h1>
      <p className='text-xl text-gray-600 mt-4'>This business site was not found.</p>
      <a href='/' className='mt-8 px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition'>
        Go Home
      </a>
    </div>
  )
}
