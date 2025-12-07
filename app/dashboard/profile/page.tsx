// app/dashboard/profile/page.tsx
import ProfileForm from '@/components/dashboard/ProfileForm';

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#383a3c]">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
      </div>
      <ProfileForm />
    </div>
  );
}
























// import ProfileForm from '@/components/dashboard/ProfileForm';

// export default function ProfilePage() {
//   return (
//     <div className="space-y-8">
//       <div>
//         <h1 className="text-3xl font-bold text-[#383a3c]">Profile Settings</h1>
//         <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
//       </div>
//       <ProfileForm />
//     </div>
//   );
// }