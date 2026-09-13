import { Route, Routes } from 'react-router-dom'
import { Nav } from './components/Nav'
import { Landing } from './pages/Landing'
import { BountyBoard } from './pages/BountyBoard'
import { ProgramDetail } from './pages/ProgramDetail'
import { MySubmissions } from './pages/MySubmissions'
import { CreateProgram } from './pages/CreateProgram'

export default function App() {
	return (
		<>
			<Nav />
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/register" element={<BountyBoard />} />
				<Route path="/programs/:id" element={<ProgramDetail />} />
				<Route path="/submissions" element={<MySubmissions />} />
				<Route path="/sponsor" element={<CreateProgram />} />
			</Routes>
		</>
	)
}
