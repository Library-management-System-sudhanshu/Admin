// Edit copy, image paths, timing and CTA here. All image paths are relative to public/.
export const FPS = 30;
export const scenes = [
  {duration:60, dark:false, lines:['Your hall.', 'Less chaos.'], red:1, kind:'opening', label:'A BETTER DAY STARTS HERE'},
  {duration:45, dark:true, lines:['Too much', 'admin?'], red:1, kind:'problem', label:'THE EVERYDAY STRUGGLE'},
  {duration:45, dark:true, lines:['Seats.', 'Fees.', 'Students.'], red:2, kind:'type', label:'SO MANY MOVING PARTS'},
  {duration:60, dark:false, lines:['Make space', 'for clarity.'], red:1, kind:'seats', label:'01 / SEAT PLANNING'},
  {duration:60, dark:true, lines:['Every fee.', 'In view.'], red:1, kind:'fees', label:'02 / FEE TRACKING'},
  {duration:60, dark:false, lines:['Your day,', 'organised.'], red:1, kind:'checklist', label:'A LITTLE MORE TOGETHER'},
  {duration:45, dark:true, lines:['Less admin.', 'More focus.'], red:1, kind:'contrast', label:'MAKE THE SWITCH'},
  {duration:60, dark:false, lines:['Meet', 'trishul.'], red:1, kind:'brand', label:'YOUR STUDY HALL WORKSPACE'},
  {duration:45, dark:false, lines:['Scattered?', 'Connected.'], red:1, kind:'students', label:'ONE SHARED PICTURE'},
  {duration:60, dark:true, lines:['Make room', 'for better.'], red:1, kind:'cta', label:'TRISHUL / BUILT FOR STUDY HALLS'},
] as const;
export const assets = {home:'screens/home.png', seats:'screens/seats.png', fees:'screens/fees.png',students:'screens/students.png'};
export const CTA = 'Register your hall';
export const CTA_DETAIL = 'Discover Trishul'; // Replace with your verified public URL or Instagram handle.
export const TOTAL_FRAMES = scenes.reduce((sum, scene) => sum + scene.duration, 0);
