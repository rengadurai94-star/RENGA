import { data } from '../data/project';
import { IS_HOSTED } from '../utils/device';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <img src="./brand/shan-poornam-logo-on-dark.svg" alt="Shan Poornam Residence by ENS" width={126} height={54} />
          <div className="footer-links">
            <a href="#overview">Overview</a>
            <a href="#explore">Explore</a>
            <a href="#plans">Floor plans</a>
            <a href="#contact">Contact</a>
            {!IS_HOSTED && (
              <>
                <a href="./brochure/SPR-Brochure-11-05-2026.pdf" target="_blank" rel="noopener">
                  Brochure (PDF)
                </a>
                <a href="#/editor">Edit project data</a>
              </>
            )}
          </div>
        </div>
        <p style={{ marginTop: 24 }}>{data.project.credit}</p>
        <p className="disclaimer">
          <strong>Disclaimer.</strong> {data.disclaimer} All content on this website is taken from {data.meta.sourceDocument}. The 3D building is a derived visualisation. The surrounding city and temple-tower silhouettes are stylised atmosphere only and do not show real buildings or positions.
        </p>
      </div>
    </footer>
  );
}
