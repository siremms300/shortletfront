import WishlistGrid from '@/components/dashboard/WishlistGrid';

export default function WishlistPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Your Wishlist</h1>
        <p className="text-gray-600 mt-2">Properties you've saved for later</p>
      </div>
      <WishlistGrid />
    </div>
  );
}