export const BoardSkeleton = () => {
	return (
		<div className='skeleton-board'>
			{/* Generamos 3 columnas falsas */}
			{[1, 2, 3].map((colIndex) => (
				<div key={colIndex} className='skeleton-column'>
					{/* Título falso */}
					<div className='skeleton-header'></div>

					{/* 3 Tarjetas falsas por columna */}
					{[1, 2, 3].map((cardIndex) => (
						<div key={cardIndex} className='skeleton-card'>
							<div className='line'></div>
							<div className='line'></div>
						</div>
					))}
				</div>
			))}
		</div>
	);
};
