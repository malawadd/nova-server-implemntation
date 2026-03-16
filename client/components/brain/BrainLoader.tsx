import dynamic from "next/dynamic";

const BrainScene = dynamic(() => import("./Brain3D"), { ssr: false });

export default BrainScene;
