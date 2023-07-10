import styles from './Loader.module.css';
import logo from '../../images/logo.png';

export default function Loader() {
  const backgroundImageStyle = {
    backgroundImage: `url(${logo})`,
  };
  return (
    <div className={`${styles['loader-wrapper']}`}>
      <div
        className={`${styles['loader-logo']}`}
        style={backgroundImageStyle}
      />
    </div>
  );
}
